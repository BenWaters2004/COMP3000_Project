<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use GuzzleHttp\Client;
use Illuminate\Http\Request;

class OsintController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id'
        ]);

        $employee = Employee::findOrFail($request->employee_id);

        // Prevent running again if already completed recently
        if ($employee->osint_status === 'completed' && $employee->osint_last_run?->gt(now()->subHours(24))) {
            return response()->json(['message' => 'OSINT already up to date'], 200);
        }

        $client = new Client(['timeout' => 300]); // 5 minutes max

        try {
            $response = $client->post('http://127.0.0.1:8001/gather_osint', [
                'json' => [
                    'full_name' => $employee->first_name . ' ' . $employee->last_name,
                    'email'     => $employee->email,
                    'domain'    => $employee->organisation->website 
                        ? parse_url($employee->organisation->website, PHP_URL_HOST) 
                        : 'company.com',
                ]
            ]);

            $data = json_decode($response->getBody(), true);

            $employee->update([
                'osint_raw'      => $data['raw_results'] ?? null,
                'osint_ranked'   => $data['ranked'] ?? null,
                'osint_status'   => 'completed',
                'osint_last_run' => now(),
            ]);

            return response()->json([
                'success' => true,
                'data'    => $data
            ]);

        } catch (\Exception $e) {
            $employee->update([
                'osint_status'   => 'failed',
                'osint_last_run' => now(),
            ]);

            return response()->json([
                'success' => false,
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
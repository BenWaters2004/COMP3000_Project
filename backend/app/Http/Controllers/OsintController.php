<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use GuzzleHttp\Client;
use Illuminate\Http\Request;
use Carbon\Carbon;

class OsintController extends Controller
{
    public function generate(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id'
        ]);

        $employee = Employee::with('organisation')->findOrFail($request->employee_id);

        // If we have recent data (last 6 hours), return it immediately
        if ($employee->osint_status === 'completed' && $employee->osint_last_run) {
            $lastRun = Carbon::parse($employee->osint_last_run);
            if ($lastRun->gt(now()->subHours(6))) {
                // Auto-generate phishing if none exists
                if (empty($employee->phishing_email)) {
                    $this->generatePhishingForEmployee($employee);
                }
                return response()->json([
                    'success' => true,
                    'data' => [
                        'raw_results' => $employee->osint_raw,
                        'ranked' => $employee->osint_ranked,
                        'phishing_email' => $employee->phishing_email,
                    ]
                ]);
            }
        }

        // Run the agent
        $client = new Client([
            'timeout' => 420,           // 7 minutes
            'connect_timeout' => 30,
        ]);

        try {
            $domain = 'company.com';
            if ($employee->organisation && $employee->organisation->website) {
                $domain = parse_url($employee->organisation->website, PHP_URL_HOST) ?? 'company.com';
            }

            $response = $client->post('http://127.0.0.1:8001/gather_osint', [
                'json' => [
                    'full_name' => trim($employee->first_name . ' ' . $employee->last_name),
                    'email'     => $employee->email,
                    'domain'    => $domain,
                ]
            ]);

            $data = json_decode($response->getBody(), true);

            // Save the result
            $employee->update([
                'osint_raw'      => $data['raw_results'] ?? null,
                'osint_ranked'   => $data['ranked'] ?? null,
                'osint_status'   => 'completed',
                'osint_last_run' => now(),
            ]);

            // Auto-generate phishing if none exists
            if (empty($employee->fresh()->phishing_email)) {
                $this->generatePhishingForEmployee($employee);
            }

            return response()->json([
                'success' => true,
                'data'    => [
                    'raw_results' => $data['raw_results'] ?? null,
                    'ranked' => $data['ranked'] ?? null,
                    'phishing_email' => $employee->fresh()->phishing_email,
                ]
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

    public function generatePhishing(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id'
        ]);

        $employee = Employee::findOrFail($request->employee_id);

        if (empty($employee->osint_raw)) {
            return response()->json([
                'success' => false,
                'error' => 'No OSINT data available. Run OSINT scan first.'
            ], 400);
        }

        try {
            $this->generatePhishingForEmployee($employee);

            return response()->json([
                'success' => true,
                'data' => [
                    'phishing_email' => $employee->fresh()->phishing_email,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function generatePhishingForEmployee(Employee $employee)
    {
        $client = new Client([
            'timeout' => 120,
            'connect_timeout' => 30,
            'verify' => false,  // Disable SSL verification for localhost
        ]);

        $fullName = trim($employee->first_name . ' ' . $employee->last_name);

        $response = $client->post('http://127.0.0.1:8001/generate_phishing', [
            'json' => [
                'full_name' => $fullName,
                'email' => $employee->email,
                'osint_data' => $employee->osint_raw,
            ]
        ]);

        $data = json_decode($response->getBody(), true);

        $employee->update([
            'phishing_email' => json_encode($data),
            'phishing_last_generated' => now(),
        ]);
    }
}
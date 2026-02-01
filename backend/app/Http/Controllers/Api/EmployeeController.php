<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Organisation;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function bulkStore(Request $request, Organisation $organisation)
    {
        $user = $request->user();

        // Ensure the logged-in admin belongs to this organisation
        if ((int)$user->organisation_id !== (int)$organisation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'employees' => ['required', 'array', 'min:1'],
            'employees.*.first_name' => ['required', 'string', 'max:80'],
            'employees.*.last_name' => ['required', 'string', 'max:80'],
            'employees.*.email' => ['required', 'email', 'max:255'],
            'employees.*.job_title' => ['nullable', 'string', 'max:120'],
            'employees.*.department' => ['nullable', 'string', 'max:120'],
        ]);

        // Optional: enforce unique email per organisation
        // We'll do a quick duplicate check against existing records + within payload.
        $emails = collect($data['employees'])->pluck('email')->map(fn($e) => strtolower(trim($e)));

        if ($emails->count() !== $emails->unique()->count()) {
            return response()->json([
                'message' => 'Duplicate emails detected in upload.',
            ], 422);
        }

        $existing = Employee::where('organisation_id', $organisation->id)
            ->whereIn('email', $emails->all())
            ->pluck('email')
            ->map(fn($e) => strtolower($e))
            ->toArray();

        if (count($existing) > 0) {
            return response()->json([
                'message' => 'Some employees already exist.',
                'existing_emails' => $existing,
            ], 422);
        }

        $rows = array_map(function ($emp) use ($organisation) {
            return [
                'organisation_id' => $organisation->id,
                'first_name' => trim($emp['first_name']),
                'last_name' => trim($emp['last_name']),
                'email' => strtolower(trim($emp['email'])),
                'job_title' => isset($emp['job_title']) ? trim($emp['job_title']) : null,
                'department' => isset($emp['department']) ? trim($emp['department']) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }, $data['employees']);

        Employee::upsert(
            $rows,
            ['organisation_id', 'email'],          // unique
            ['first_name', 'last_name', 'job_title', 'department', 'updated_at'] // fields to update
        );

        return response()->json([
            'message' => 'Employees added successfully.',
            'count' => count($rows),
        ], 201);
    }
}

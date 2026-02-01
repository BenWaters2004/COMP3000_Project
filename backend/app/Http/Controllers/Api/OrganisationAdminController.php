<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OrganisationAdminController extends Controller
{
    public function store(Request $request, Organisation $organisation)
    {
        // Prevent creating multiple admins during setup (simple prototype rule).
        $existingAdminCount = User::where('organisation_id', $organisation->id)->count();
        if ($existingAdminCount > 0) {
            return response()->json([
                'message' => 'Admin already exists for this organisation.'
            ], 409);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            // expects password_confirmation in request
        ]);

        $user = User::create([
            'organisation_id' => $organisation->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            // Optional: 'role' => 'org_admin'
        ]);

        return response()->json([
            'message' => 'Organisation admin created successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'organisation_id' => $user->organisation_id,
            ],
        ], 201);
    }
}

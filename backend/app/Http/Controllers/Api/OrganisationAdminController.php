<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OrganisationAdminController extends Controller
{
    # List all admins for an organisation
    public function index(Organisation $organisation)
    {
        $this->authorizeOrg($organisation);
        return User::where('organisation_id', $organisation->id)
            ->select('id', 'name', 'email', 'created_at')
            ->orderBy('name')
            ->get();
    }

    # Add a new admin to the organisation
    public function store(Request $request, Organisation $organisation)
    {

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'organisation_id' => $organisation->id,
            'name'            => $validated['name'],
            'email'           => $validated['email'],
            'password'        => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Admin created',
            'admin'   => $user->only(['id', 'name', 'email']),
        ], 201);
    }

    # Delete an admin from the organisation
    public function destroy(Organisation $organisation, User $admin)
    {
        $this->authorizeOrg($organisation);

        if ($admin->organisation_id !== $organisation->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if ($admin->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }

        $admin->delete();

        return response()->json(['message' => 'Admin removed']);
    }

    # Helper to check if the authenticated user belongs to the organisation
    private function authorizeOrg(Organisation $org)
    {
        if ((int)auth()->user()->organisation_id !== (int)$org->id) {
            abort(403, 'Forbidden');
        }
    }
}

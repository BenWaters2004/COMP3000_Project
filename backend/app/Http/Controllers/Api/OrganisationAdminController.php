<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OrganisationAdminController extends Controller
{
    public function index(Organisation $organisation)
    {
        $this->authorizeOrg($organisation);
        return User::where('organisation_id', $organisation->id)
            ->select('id', 'name', 'email', 'created_at')
            ->orderBy('name')
            ->get();
    }

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

    public function resetPassword(Organisation $organisation, User $admin)
    {
        $this->authorizeOrg($organisation);

        if ($admin->organisation_id !== $organisation->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        // Prototype: just return token (in production → send real email)
        $token = Str::random(60);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $admin->email],
            ['token' => Hash::make($token), 'created_at' => now()]
        );

        return response()->json([
            'message' => 'Password reset link generated (prototype mode)',
            'token'   => $token, // remove in production
        ]);
    }

    private function authorizeOrg(Organisation $org)
    {
        if ((int)auth()->user()->organisation_id !== (int)$org->id) {
            abort(403, 'Forbidden');
        }
    }
}

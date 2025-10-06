<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consent;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ConsentController extends Controller
{
    /**
     * Store a consent record.
     * Expects: name, email, target, agree=true
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'target' => 'required|string|max:255',
            'agree' => 'accepted',
            'meta' => 'nullable|array',
        ]);

        $consent = Consent::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'target' => $data['target'],
            'agreed_at' => now(),
            'ip' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
            'meta' => $data['meta'] ?? null,
        ]);

        // Immutable audit log entry (optional: write to a separate audit store)
        Log::info('Consent recorded', [
            'consent_id' => $consent->id,
            'email' => $consent->email,
            'target' => $consent->target,
            'ip' => $consent->ip,
            'ts' => $consent->agreed_at->toDateTimeString(),
        ]);

        return response()->json([
            'consent_id' => $consent->id,
            'message' => 'Consent recorded',
        ], 201);
    }
}
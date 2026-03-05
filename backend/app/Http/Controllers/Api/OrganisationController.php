<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrganisationRequest;
use App\Models\Organisation;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

class OrganisationController extends Controller
{
    public function store(StoreOrganisationRequest $request)
    {
        $data = $request->validated();

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('org-logos', 'public');
        }

        $org = Organisation::create([
            'name' => $data['name'],
            'website' => $data['website'] ?? null,
            'industry' => $data['industry'] ?? null,
            'size' => $data['size'] ?? null,
            'logo_path' => $logoPath,
        ]);

        return response()->json([
            'message' => 'Organisation created successfully',
            'organisation' => $org,
        ], 201);
    }

    public function update(Request $request, Organisation $organisation)
    {
        $user = $request->user();

        if ((int)$user->organisation_id !== (int)$organisation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'website'  => ['nullable', 'url', 'max:255'],
            'industry' => ['nullable', 'string', 'max:120'],
            'size'     => ['nullable', 'string', 'max:30'],
            'logo'     => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $updates = $validated;

        if ($request->hasFile('logo')) {
            if ($organisation->logo_path) {
                Storage::disk('public')->delete($organisation->logo_path);
            }
            $updates['logo_path'] = $request->file('logo')->store('org-logos', 'public');
        }

        $organisation->update($updates);

        return response()->json([
            'message'      => 'Organisation updated',
            'organisation' => $organisation->fresh(),
        ]);
    }

    public function show(Organisation $organisation)
    {
        $user = auth()->user();
        if ((int)$user->organisation_id !== (int)$organisation->id) {
            abort(403);
        }

        return response()->json([
            'organisation' => $organisation->load('settings'),
        ]);
    }
}
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

        if (!$user || (int)$user->organisation_id !== (int)$organisation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'website' => ['required', 'url', 'max:255'],
            'industry' => ['required', 'string', 'max:120'],
            'size' => ['required', 'string', 'max:30'],
            'logo' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $updates = $data;

        if ($request->hasFile('logo')) {
            if ($organisation->logo_path) {
                Storage::disk('public')->delete($organisation->logo_path);
            }
            $updates['logo_path'] = $request->file('logo')->store('org-logos', 'public');
        }

        $organisation->update($updates);

        return response()->json([
            'message' => 'Organisation updated.',
            'organisation' => $organisation,
        ]);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\OrganisationSetting; // or OrganisationSettings depending on your naming
use Illuminate\Http\Request;

class OrganisationSettingsController extends Controller
{
    public function update(Request $request, Organisation $organisation)
    {
        $user = $request->user();

        if ((int)$user->organisation_id !== (int)$organisation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'simulation_frequency' => ['required', 'in:daily,weekly,biweekly,monthly'],
            'timezone' => ['required', 'string', 'max:60'],
            'start_at' => ['nullable', 'date'],
        ]);

        $settings = OrganisationSetting::updateOrCreate(
            ['organisation_id' => $organisation->id],
            [
                'simulation_frequency' => $data['simulation_frequency'],
                'timezone' => $data['timezone'],
                'start_at' => $data['start_at'] ?? null,
            ]
        );

        return response()->json([
            'message' => 'Settings saved.',
            'settings' => $settings,
        ]);
    }
}

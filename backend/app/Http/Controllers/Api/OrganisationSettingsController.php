<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organisation;
use App\Models\OrganisationSetting;
use App\Models\CompanySize;
use App\Models\Industry;
use App\Models\SimulationFrequency;
use App\Models\Timezone;
use Illuminate\Http\Request;

class OrganisationSettingsController extends Controller
{
    public function update(Request $request, Organisation $organisation)
    {
        $user = $request->user();
        if ((int)$user->organisation_id !== (int)$organisation->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'simulation_frequency' => ['sometimes', 'in:daily,3_days,weekly,biweekly,monthly'],
            'timezone'             => ['sometimes', 'string', 'max:60'],
            'start_at'             => ['nullable', 'date'],
            'primary_color'        => ['sometimes', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'enable_mfa'           => ['sometimes', 'boolean'],
            'send_reports'         => ['sometimes', 'boolean'],
        ]);

        $settings = OrganisationSetting::updateOrCreate(
            ['organisation_id' => $organisation->id],
            $validated
        );

        return response()->json([
            'message'  => 'Settings updated',
            'settings' => $settings,
        ]);
    }

    public function industries()
    {
        return response()->json(
            Industry::orderBy('id')->pluck('name')->toArray()
        );
    }

    public function companySizes()
    {
        return response()->json(
            CompanySize::orderBy('id')->pluck('ranges')->toArray()
        );
    }

    public function frequencies()
    {
        return response()->json(
            SimulationFrequency::select('value', 'label')
                ->orderBy('id')
                ->get()
        );
    }

    public function timezones()
    {
        return response()->json(
            Timezone::orderBy('group_name')->orderBy('order')->get()->groupBy('group_name')
                ->map(function ($group, $groupName) {
                    return [
                        'group_name' => $groupName,
                        'zones' => $group->map(fn($tz) => [
                            'value' => $tz->name,
                            'label' => $tz->display_name,
                        ])->values()->toArray(),
                    ];
                })->values()->toArray()
        );
    }
}

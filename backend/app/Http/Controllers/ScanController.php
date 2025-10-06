<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Consent;
use App\Models\ScanResult;
use Illuminate\Validation\ValidationException;

class ScanController extends Controller
{
    protected $sfApiUrl;
    protected $sfApiKey;

    public function __construct()
    {
        $this->sfApiUrl = config('services.spiderfoot.base_url', env('SPIDERFOOT_API_URL'));
        $this->sfApiKey = env('SPIDERFOOT_API_KEY');
    }

    /**
     * Start scan (skeleton) - for now this validates and returns a fake scan id.
     * Later you will replace body to call SpiderFoot API.
     */
    public function start(Request $request)
    {
        $data = $request->validate([
            'consent_id' => 'required|integer|exists:consents,id',
            'target' => 'required|string|max:255',
        ]);

        // For now: create a local scan identifier (you will use SpiderFoot's scan id later)
        $scanId = 'devscan_' . time() . '_' . rand(1000, 9999);

        Log::info('Scan requested', [
            'scan_id' => $scanId,
            'consent_id' => $data['consent_id'],
            'target' => $data['target'],
        ]);

        // Return a scan id to the frontend. Later, an async job will trigger SpiderFoot.
        return response()->json(['scan_id' => $scanId], 201);
    }

    /**
     * Store results (example). This expects SpiderFoot JSON to be posted by an internal job/process.
     */
    public function storeResults(Request $request)
    {
        $data = $request->validate([
            'scan_id' => 'required|string',
            'consent_id' => 'nullable|integer|exists:consents,id',
            'raw_json' => 'required|string',
            'summary' => 'nullable|string|max:1000',
        ]);

        $sr = ScanResult::storeEncrypted($data['scan_id'], $data['consent_id'] ?? null, $data['raw_json'], $data['summary'] ?? null);

        Log::info('Scan results stored', ['scan_result_id' => $sr->id, 'scan_id' => $data['scan_id']]);

        return response()->json(['scan_result_id' => $sr->id], 201);
    }

    /**
     * Example endpoint to return a non-sensitive summary to UI.
     * Requires proper auth in production.
     */
    public function summary($id)
    {
        $sr = ScanResult::findOrFail($id);

        // Only return the summary field and timestamps — do NOT return decrypted payload here.
        return response()->json([
            'id' => $sr->id,
            'scan_id' => $sr->scan_id,
            'summary' => $sr->summary,
            'stored_at' => $sr->stored_at,
            'created_at' => $sr->created_at,
        ]);
    }
}
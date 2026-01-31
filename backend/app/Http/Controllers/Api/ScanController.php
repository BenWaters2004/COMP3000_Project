<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ScanRequest;
use App\Jobs\RunOsintScan;
use Illuminate\Support\Facades\Validator;

class ScanController extends Controller
{
    public function initiate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'consent' => 'required|boolean|accepted'
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        // create scan request
        $scan = ScanRequest::create([
            'email' => $request->email,
            'consent' => $request->consent,
            'status' => 'pending'
        ]);
        // dispatch asynchronous job
        RunOsintScan::dispatch($scan->id);
        return response()->json(['scan_id' => $scan->id], 201);
    }

    public function results($id)
    {
        $scan = ScanRequest::with('results')->findOrFail($id);
        return response()->json([
            'status' => $scan->status,
            'results' => $scan->results->map(function ($r) {
                return [
                    'module' => $r->module,
                    'type' => $r->type,
                    // decrypt the data before sending to the user
                    'data' => decrypt($r->data),
                    'score' => $r->score
                ];
            })
        ]);
    }
}
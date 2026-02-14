<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
// Assume you have Employee model; adjust as needed

class OsintController extends Controller
{
    protected $agentApiUrl = 'http://localhost:8000/gather_osint';  // Update to your Python service URL

    public function gatherOsint(Request $request)
    {
        $this->middleware('auth');  // Tie to your login system

        $request->validate([
            'full_name' => 'required|string',
            'email' => 'required|email',
            'domain' => 'required|string',
        ]);

        // Optional: Check consent flag in DB before proceeding

        $client = new Client();
        try {
            $response = $client->post($this->agentApiUrl, [
                'json' => $request->only(['full_name', 'email', 'domain']),
            ]);
            $data = json_decode($response->getBody(), true);

            // Store results (e.g., in Employee model or reports table for visualizations)
            // Employee::createOrUpdate([... , 'osint_report' => json_encode($data)]);

            return response()->json($data);
        } catch (RequestException $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
<?php

// app/Http/Controllers/Api/EmailController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ScanRequest;
use App\Models\OsintResult;
use App\Models\Email;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Crypt;

class EmailController extends Controller
{
    public function generate($id)
    {
        $scan = ScanRequest::findOrFail($id);
        // fetch top results by score
        $osintData = OsintResult::where('scan_request_id', $scan->id)
            ->orderBy('score', 'desc')->take(20)->get();
        // call your Python microservice (replace URL with your service)
        $response = Http::post('http://localhost:5005/generate_email', [
            'osint' => $osintData->map(function ($item) {
                return [
                    'module' => $item->module,
                    'type' => $item->type,
                    'data' => decrypt($item->data),
                    'score' => $item->score,
                    'corroboration' => $item->corroboration
                ];
            })
        ]);
        $content = $response->json('email');
        // encrypt email content for storage:contentReference[oaicite:4]{index=4}
        Email::create([
            'scan_request_id' => $scan->id,
            'content' => Crypt::encryptString($content)
        ]);
        return response()->json(['email' => $content]);
    }
}
<?php

namespace App\Jobs;

use App\Models\ScanRequest;
use App\Models\OsintResult;
use App\Services\SpiderFootService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class RunOsintScan implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $scanId;

    public function __construct($scanId)
    {
        $this->scanId = $scanId;
    }

    public function handle(SpiderFootService $spider)
    {
        $scan = ScanRequest::find($this->scanId);
        if (! $scan) return;
        $scan->update(['status' => 'running']);
        // run SpiderFoot scan and obtain raw results
        $rawResults = $spider->runScan($scan->email);
        // rank and store results
        foreach ($rawResults as $result) {
            $score = $spider->rank($result);
            OsintResult::create([
                'scan_request_id' => $scan->id,
                'module' => $result['module'],
                'type' => $result['type'],
                'data' => encrypt($result['data']),
                'date_found' => $result['date_found'],
                'corroboration' => $result['corroboration'],
                'score' => $score
            ]);
        }
        $scan->update(['status' => 'finished']);
        // optionally broadcast stats via events (not covered here)
    }
}
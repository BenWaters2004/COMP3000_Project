<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SpiderFootService
{
    public function health(): bool
    {
        $base = rtrim(config('services.spiderfoot.base_url'), '/');
        $res = Http::timeout(5)->get($base . '/');
        return $res->ok() && str_contains($res->body(), 'SpiderFoot');
    }
}
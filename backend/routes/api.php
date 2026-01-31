<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\EmailController;
use App\Services\SpiderFootService;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

################
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
##################

Route::post('/scan', [ScanController::class, 'initiate']);
Route::get('/scan/{id}', [ScanController::class, 'results']);
Route::post('/email/{id}', [EmailController::class, 'generate']);
Route::get('/spiderfoot/health', function (SpiderFootService $svc) {
    return response()->json(['ok' => $svc->health()]);
});
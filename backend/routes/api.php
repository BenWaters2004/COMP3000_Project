<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConsentController;
use App\Http\Controllers\ScanController;

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

Route::get('/ping', function (Request $request) {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toDateTimeString()
    ]);
});

Route::post('/consent', [ConsentController::class, 'store']);
Route::post('/scans/start', [ScanController::class, 'start']);        // start (skeleton)
Route::post('/scans/results', [ScanController::class, 'storeResults']); // internal use
Route::get('/scans/result/{id}/summary', [ScanController::class, 'summary']);

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\ScanController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\OrganisationController;
use App\Http\Controllers\Api\OrganisationAdminController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\OrganisationSettingsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\OsintController;

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

Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return $request->user();
});

##################

Route::post('/scan', [ScanController::class, 'initiate']);
Route::get('/scan/{id}', [ScanController::class, 'results']);
Route::post('/email/{id}', [EmailController::class, 'generate']);
Route::get('/spiderfoot/health', function (SpiderFootService $svc) {
    return response()->json(['ok' => $svc->health()]);
});


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/osint/generate', [OsintController::class, 'generate']);
});


Route::post('/organisations', [OrganisationController::class, 'store']);
Route::middleware('auth:sanctum')->put('/organisations/{organisation}', [OrganisationController::class, 'update']);
Route::post('/organisations/{organisation}/admin', [OrganisationAdminController::class, 'store']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::post('/organisations/{organisation}/employees/bulk', [EmployeeController::class, 'bulkStore']);
    Route::put('/organisations/{organisation}/settings', [OrganisationSettingsController::class, 'update']);

    
    Route::get('/organisations/{organisation}/employees', [EmployeeController::class, 'index']);

    Route::get('/me', function (Request $request) {
        return $request->user();
    });
});
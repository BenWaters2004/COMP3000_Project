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
Route::middleware('auth:sanctum')->get('/auth/me', function (Request $request) {
    return $request->user();
});
##################

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    })->name('logout');

    Route::post('/osint/generate', [OsintController::class, 'generate']);
    Route::post('/osint/generate-phishing', [OsintController::class, 'generatePhishing']);

    Route::post('/organisations/{organisation}/employees/bulk', [EmployeeController::class, 'bulkStore']);
    Route::put('/organisations/{organisation}/settings', [OrganisationSettingsController::class, 'update']);
    Route::get('/organisations/{organisation}/employees', [EmployeeController::class, 'index']);
    Route::patch('/organisations/{organisation}', [OrganisationController::class, 'update']);
    Route::get('/organisations/{organisation}', [OrganisationController::class, 'show']);
    

    Route::get('/organisations/{organisation}/admins', [OrganisationAdminController::class, 'index']);
    Route::post('/organisations/{organisation}/admins', [OrganisationAdminController::class, 'store']);
    Route::delete('/organisations/{organisation}/admins/{admin}', [OrganisationAdminController::class, 'destroy']);
    Route::post('/organisations/{organisation}/admins/{admin}/reset-password', [OrganisationAdminController::class, 'resetPassword']);
});

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/organisations', [OrganisationController::class, 'store']);
Route::post('/organisations/{organisation}/admin', [OrganisationAdminController::class, 'store']);
Route::get('/settings/industries', [OrganisationSettingsController::class, 'industries']);
Route::get('/settings/company-sizes', [OrganisationSettingsController::class, 'companySizes']);
Route::get('/settings/frequencies', [OrganisationSettingsController::class, 'frequencies']);
Route::get('/settings/timezones', [OrganisationSettingsController::class, 'timezones']);
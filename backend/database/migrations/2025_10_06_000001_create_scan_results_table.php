<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateScanResultsTable extends Migration
{
    public function up()
    {
        Schema::create('scan_results', function (Blueprint $table) {
            $table->id();
            $table->string('scan_id')->index()->nullable(false);
            $table->foreignId('consent_id')->nullable()->constrained('consents')->onDelete('cascade');
            $table->text('encrypted_payload')->comment('Encrypted raw JSON from SpiderFoot or other OSINT source');
            $table->timestamp('stored_at')->nullable();
            $table->string('summary')->nullable()->comment('Optional short summary for quick UI display');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('scan_results');
    }
}
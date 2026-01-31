<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('osint_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scan_request_id')->constrained()->onDelete('cascade');
            $table->string('module');    // e.g., sfp_whois
            $table->string('type');      // data type (INTERNET_NAME, PHONE_NUMBER, etc.)
            $table->text('data');        // encrypted data (see encryption example below)
            $table->timestamp('date_found')->nullable();
            $table->integer('corroboration')->default(0);
            $table->float('score')->default(0);  // ranking score
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('osint_results');
    }
};

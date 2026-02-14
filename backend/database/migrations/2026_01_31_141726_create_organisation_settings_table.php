<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('organisation_settings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organisation_id')
                ->constrained('organisations')
                ->cascadeOnDelete();

            $table->string('simulation_frequency', 20)->default('weekly'); // daily/weekly/biweekly/monthly
            $table->string('timezone', 60);
            $table->dateTime('start_at')->nullable();

            $table->timestamps();

            // one settings row per organisation
            $table->unique('organisation_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organisation_settings');
    }
};

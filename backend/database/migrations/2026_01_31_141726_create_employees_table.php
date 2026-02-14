<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('organisation_id')
                ->constrained('organisations')
                ->cascadeOnDelete();

            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('email', 255);

            $table->string('job_title', 120)->nullable();
            $table->string('department', 120)->nullable();

            //OSINT
            $table->longText('osint_raw')->nullable();
            $table->longText('osint_ranked')->nullable();
            $table->string('osint_status')->default('pending'); // pending, completed, failed
            $table->timestamp('osint_last_run')->nullable();

            $table->timestamps();

            // enforce unique email per organisation
            $table->unique(['organisation_id', 'email']);
            $table->index(['organisation_id', 'last_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};

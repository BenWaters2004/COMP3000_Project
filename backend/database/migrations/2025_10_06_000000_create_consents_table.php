<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateConsentsTable extends Migration
{
    public function up()
    {
        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->index();
            $table->string('target')->comment('Identifier being scanned (email/username/etc)');
            $table->timestamp('agreed_at')->nullable();
            $table->string('ip')->nullable();
            $table->text('user_agent')->nullable();
            $table->json('meta')->nullable()->comment('Optional: stored metadata about consenting user');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('consents');
    }
}
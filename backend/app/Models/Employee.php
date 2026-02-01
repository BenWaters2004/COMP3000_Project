<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'organisation_id',
        'first_name',
        'last_name',
        'email',
        'job_title',
        'department',
    ];
}

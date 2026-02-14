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
        'osint_raw',
        'osint_ranked',
        'osint_status', 
        'osint_last_run'
    ];

    public function organisation()
    {
        return $this->belongsTo(Organisation::class);
    }
}
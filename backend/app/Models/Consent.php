<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Consent extends Model
{
    protected $fillable = [
        'name',
        'email',
        'target',
        'agreed_at',
        'ip',
        'user_agent',
        'meta',
    ];

    protected $casts = [
        'agreed_at' => 'datetime',
        'meta' => 'array',
    ];

    public function scanResults()
    {
        return $this->hasMany(ScanResult::class);
    }
}
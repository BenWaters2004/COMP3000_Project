<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScanRequest extends Model
{
    protected $fillable = ['email', 'consent', 'status'];

    public function results()
    {
        return $this->hasMany(OsintResult::class);
    }
    public function email()
    {
        return $this->hasOne(Email::class);
    }
}
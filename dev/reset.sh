#!/bin/sh
P="psql -h /tmp -p 54329 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists teste" && $P -c "create database teste" && $P -d teste -f dev/supabase_shim.sql && $P -d teste -f supabase/migrations/0001_sistema.sql

#!/bin/bash


# script to create sharded collections

echo "

use hotelbooking

sh.enableSharding(\"hotelbooking\")

db.createCollection(\"ratings\");



sh.shardCollection(\"hotelbooking.ratings\", { typeRoom: \"hashed\" });



" > setup.txt

mongosh mongodb://$ip:60001 < setup.txt
#!/bin/bash
env $(cat .env) echo "$TWILIO_ACCOUNT_SID" >> /home/sgnl/crontest

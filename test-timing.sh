#!/bin/bash

# Test script for discord-tool timing

# Channel IDs for echo server
CHANNEL_ID="958756386823610409"  # bazaarians

echo "=== Starting timing test ==="
echo ""

# Kill any existing server
echo "[1] Cleaning up any existing server..."
pkill -9 -f "discord-tool" 2>/dev/null
pkill -9 -f "tsx.*server" 2>/dev/null
rm -f /tmp/discord-tool.sock
sleep 1

# Verify clean state
if [ -S /tmp/discord-tool.sock ]; then
    echo "ERROR: Socket still exists after cleanup"
    exit 1
fi
echo "Clean state confirmed"
echo ""

# Start join and measure time
echo "[2] Starting join command..."
JOIN_START=$(date +%s.%N)

discord-tool join mines bazaarians 2>&1 | tee /tmp/join_output.txt &
JOIN_PID=$!

# Wait for join to complete (socket ready)
for i in {1..50}; do
    if [ -S /tmp/discord-tool.sock ]; then
        echo "Socket ready after $(echo "$(date +%s.%N) - $JOIN_START" | bc) seconds"
        break
    fi
    sleep 0.1
done

# Get the join output
wait $JOIN_PID
JOIN_END=$(date +%s.%N)
JOIN_DURATION=$(echo "$JOIN_END - $JOIN_START" | bc)
echo "Join command completed in $JOIN_DURATION seconds"
echo ""

# Check connection status
echo "[3] Checking status..."
STATUS_START=$(date +%s.%N)
discord-tool status 2>&1
STATUS_END=$(date +%s.%N)
STATUS_DURATION=$(echo "$STATUS_END - $STATUS_START" | bc)
echo "Status command took $STATUS_DURATION seconds"
echo ""

# Queue TTS
echo "[4] Queueing TTS..."
TTS_START=$(date +%s.%N)
discord-tool tts "Hello, this is a test" 2>&1
TTS_END=$(date +%s.%N)
TTS_DURATION=$(echo "$TTS_END - $TTS_START" | bc)
echo "TTS command took $TTS_DURATION seconds"
echo ""

# Wait a bit for audio to potentially play
echo "[5] Waiting for audio to play..."
sleep 5

# Check status again
echo "[6] Final status check..."
discord-tool status 2>&1
echo ""

# Leave
echo "[7] Leaving channel..."
discord-tool leave 2>&1
echo ""

# Show timing summary
echo "=== TIMING SUMMARY ==="
echo "Join:    $JOIN_DURATION seconds"
echo "Status:  $STATUS_DURATION seconds"  
echo "TTS:     $TTS_DURATION seconds"
echo "========================"

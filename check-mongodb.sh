#!/bin/bash
# Quick script to check MongoDB data

echo "==================================="
echo "Checking MongoDB for activity data"
echo "==================================="
echo ""

# Replace with your MongoDB connection string if using Atlas
# Or use mongosh directly if using local MongoDB

echo "To check your data, run ONE of these commands:"
echo ""
echo "Option 1 - If using MongoDB Atlas:"
echo 'mongosh "your-atlas-connection-string" --eval "use vscode_tracker; db.activitylogs.find().pretty()"'
echo ""
echo "Option 2 - If using local MongoDB:"
echo 'mongosh --eval "use vscode_tracker; db.activitylogs.find().pretty()"'
echo ""
echo "Option 3 - Check summaries:"
echo 'mongosh --eval "use vscode_tracker; db.useractivitysummaries.find().pretty()"'
echo ""
echo "Option 4 - Count documents:"
echo 'mongosh --eval "use vscode_tracker; db.activitylogs.countDocuments()"'

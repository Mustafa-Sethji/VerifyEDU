#!/bin/bash
set -e
cd "$(dirname "$0")/src" 2>/dev/null || cd src

find . -type f \( -name "*.jsx" -o -name "*.js" \) -print0 | xargs -0 sed -i '' \
  -e 's/bg-\[#0B0F19\]/bg-white/g' \
  -e 's/bg-\[#111827\]/bg-gray-50/g' \
  -e 's/bg-gray-950/bg-white/g' \
  -e 's/bg-gray-900/bg-white/g' \
  -e 's/bg-gray-800/bg-gray-50/g' \
  -e 's/bg-purple-950/bg-green-50/g' \
  -e 's/bg-purple-900/bg-green-100/g' \
  -e 's/bg-purple-600/bg-green-600/g' \
  -e 's/bg-purple-500/bg-green-500/g' \
  -e 's/bg-blue-950/bg-green-50/g' \
  -e 's/bg-blue-500/bg-green-500/g' \
  -e 's/text-white/text-gray-900/g' \
  -e 's/text-purple-400/text-green-600/g' \
  -e 's/text-purple-300/text-green-600/g' \
  -e 's/text-purple-200/text-green-700/g' \
  -e 's/text-blue-400/text-green-600/g' \
  -e 's/text-blue-300/text-green-600/g' \
  -e 's/text-gray-300/text-gray-600/g' \
  -e 's/text-gray-400/text-gray-500/g' \
  -e 's/text-gray-200/text-gray-700/g' \
  -e 's/text-gray-100/text-gray-800/g' \
  -e 's/border-gray-800/border-gray-200/g' \
  -e 's/border-gray-700/border-gray-200/g' \
  -e 's/border-gray-600/border-gray-300/g' \
  -e 's/from-purple-950/from-green-100/g' \
  -e 's/from-purple-900/from-green-100/g' \
  -e 's/from-purple-600/from-green-600/g' \
  -e 's/from-purple-500/from-green-500/g' \
  -e 's/from-blue-600/from-emerald-600/g' \
  -e 's/from-blue-500/from-emerald-500/g' \
  -e 's/to-blue-950/to-emerald-100/g' \
  -e 's/to-blue-900/to-emerald-100/g' \
  -e 's/to-blue-600/to-emerald-600/g' \
  -e 's/to-blue-500/to-emerald-500/g' \
  -e 's/to-indigo-600/to-emerald-600/g' \
  -e 's/to-indigo-500/to-emerald-500/g'

echo "Done. Now check the frontend in the browser and update index.css + tailwind.config.js as instructed."
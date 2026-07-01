#!/usr/bin/env bash
set -euo pipefail

declare -a files=()

while IFS= read -r line; do
	if [[ ${#line} -lt 4 ]]; then
		continue
	fi
	path=${line:3}
	if [[ $path == *" -> "* ]]; then
		path=${path##* -> }
	fi
	if [[ -z $path ]]; then
		continue
	fi
	if [[ ! -e $path ]]; then
		continue
	fi
	if [[ -d $path ]]; then
		continue
	fi
	case "${path##*.}" in
		js|cjs|mjs|jsx|ts|tsx|cts|mts|json|jsonc)
			files+=("$path")
			;;
		*)
			continue
			;;
	esac
done < <(git status --porcelain)

if [[ ${#files[@]} -eq 0 ]]; then
	echo "No changed JS/TS files detected; nothing to fix."
	exit 0
fi

npx biome check --write --unsafe "${files[@]}"

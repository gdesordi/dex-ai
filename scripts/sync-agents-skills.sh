#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "${script_dir}/.." && pwd)"
source_dir="${repository_root}/skills"
destination_dir="${repository_root}/.agents/skills"

if [[ ! -d "${source_dir}" ]]; then
  echo "Erro: diretório de origem não encontrado: ${source_dir}" >&2
  exit 1
fi

mkdir -p -- "${destination_dir}"

find "${destination_dir}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a -- "${source_dir}/." "${destination_dir}/"

echo "Conteúdo de skills copiado para .agents/skills."

#!/bin/bash

echo "=========================================="
echo "🖥️  SYSTEM SPECIFICATIONS"
echo "=========================================="
echo ""

echo "📊 CPU Info:"
lscpu | grep -E "Model name|CPU\(s\)|Thread|Core"
echo ""

echo "💾 RAM Info:"
free -h | grep -E "Mem|Swap"
echo ""

echo "🎮 GPU Info:"
lspci | grep -i vga
echo ""

echo "🐍 Python Version:"
python3 --version
echo ""

echo "📦 PyTorch Info (if installed):"
python3 -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'CPU Threads: {torch.get_num_threads()}')" 2>/dev/null || echo "PyTorch not installed"
echo ""

echo "💿 Disk Space:"
df -h / | grep -E "Filesystem|/"
echo ""

echo "🔧 OS Info:"
cat /etc/fedora-release 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME
echo ""

echo "=========================================="

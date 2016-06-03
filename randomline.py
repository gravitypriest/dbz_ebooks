import os
import random
import re
import sys


def process_line(line):
    line = line.replace('\\N', ' ')
    line = line.replace('{\\i1}', '').replace('{\\i0}', '')
    line = re.sub(r'\{\\an\d.*?\}', '', line)
    return line.strip()

this_dir = os.path.dirname(os.path.realpath(__file__))
sub_dir = os.path.join(this_dir, 'subtitles')
files = os.listdir(sub_dir)
rdm_idx = random.randint(0, len(files) - 1)

target_file = os.path.join(sub_dir, files[rdm_idx])
all_lines = []

with open(target_file, 'r') as _file:
    for line in _file:
        if line.startswith('Dialogue: '):
            line_parts = line.split(',', 9)
            diag = line_parts[9]
            all_lines.append(diag)

rdm_idx_2 = random.randint(0, len(all_lines) - 1)
pre_output = all_lines[rdm_idx_2]
post_output = process_line(pre_output)
trimmed_output = post_output[140:] if len(post_output) > 140 else post_output

sys.stdout.write(trimmed_output)

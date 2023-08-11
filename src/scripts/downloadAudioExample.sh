# TODO: make this into an actual script

# Download audio from youtube
youtube-dl -f bestaudio --extract-audio --audio-format mp3 --audio-quality 320K 'https://www.youtube.com/watch?v=HawbJ76Xg1Y'

# Conversion from webm to mp3 example
# from: https://stackoverflow.com/questions/9913032/how-can-i-extract-audio-from-video-with-ffmpeg
ffmpeg -i The\ Blue\ Whale-yjamrOtMKfE.webm -b:a 320K -map a the-blue-whale.mp3

# Important learning: do not use variable bit rate mp3. Wavesurfer has issues with desynchronizing
# the audio and the waveform. Specify a bitrate of 256K or 320K.

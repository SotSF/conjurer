# TODO: make this into an actual script

# Download audio from youtube
# haven't tried the below, from copilot
youtube-dl -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 https://www.youtube.com/watch?v=yjamrOtMKfE

# used this
youtube-dl 'https://www.youtube.com/watch?v=yjamrOtMKfE'
# from: https://stackoverflow.com/questions/9913032/how-can-i-extract-audio-from-video-with-ffmpeg
ffmpeg -i The\ Blue\ Whale-yjamrOtMKfE.webm -q:a 0 -map a the-blue-whale.mp3

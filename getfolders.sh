declare -a folders

while read -r line
do
    if [[ $line =~ "\"projectFolder\":" ]]
    then
        folders+=(${line:18:-3 })
    fi
done < ./rush.json

for folder in ${folders[@]}
do
    cd ./$folder/config
    # rm rush-project.json
    pwd
    cp /c/build_caching_rush/itwinjs-core/config/rush-project.json .
    cd /c/build_caching_rush/itwinjs-core
done
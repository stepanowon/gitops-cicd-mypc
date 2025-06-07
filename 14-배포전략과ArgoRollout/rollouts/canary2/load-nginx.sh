#!/bin/bash
# 1초에 한번씩 ingress-nginx-controller로 요청함
nginxurl="example.com.$(kubectl get svc/ingress-nginx-controller -o json -n ingress-nginx | \
  jq -r .status.loadBalancer.ingress[0].ip).nip.io"

while true
do
    curl -s $nginxurl > /dev/null
    printf "$nginxurl 로 요청\n"
    sleep 1
done

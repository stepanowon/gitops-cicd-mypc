#!/bin/bash
# 1초에 한번씩 ingress-nginx-controller로 요청함
requesturl="example.com.$(kubectl get svc/haproxy-ingress-kubernetes-ingress -o json -n haproxy-controller | \
  jq -r .status.loadBalancer.ingress[0].ip).nip.io"

while true
do
    curl -s $requestxurl > /dev/null
    printf "$requestxurl 로 요청\n"
    sleep 1
done

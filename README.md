# 2026.1 변경 사항
- [Argocd Image updater가 0.14.0에서 1.0으로 업그레이드](#imageupdater)
- [Ingress Nginx Controller 지원종료로 인해 haproxy-ingress-controller로 교체](#haproxy)
---
<a id="imageupdater"></a>
## Argocd Image updater가 0.14.0에서 1.0으로 업그레이드되었습니다.
#### 기존 버전을 사용하려면
- helm으로 argocd image updater를 설치할 때 다음 명령문을 실행하도록 설정하세요.
```
@@ 슬라이드27
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update argo

helm install argocd-image-updater argo/argocd-image-updater --version 0.14.0 \
--namespace argocd \
--values values-image-updater.yaml
```
#### 1.x 버전을 사용하려면 다음 가이드는 따릅니다.
- 슬라이드 26 부터의 가이드가 다음과 같이 바뀝니다.
```
# values-image-updater.yaml 파일
config:
  argocd:
    grpcWeb: true
    serverAddress: "ARGOCD서버주소"    # 예시: 192.168.56.51,   'https://'는 지정하지 않음
    insecure: true
    plaintext: false
  logLevel: debug
  registries:     # Docker Hub는 이 설정 필요없음. Docker Hub가 아닌 레지스트리만 등록
    - name: nexus1
      api_url: "http://192.168.56.103:8082"
      prefix:  "192.168.56.103:8082"
      ping: true
      insecure: true
      credentials: "secret:argocd/nexus-cred"		# 형식 : "secret:네임스페이스/시크릿명"
```

- 슬라이드 27
```
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update argo

helm install argocd-image-updater argo/argocd-image-updater \
--namespace argocd \
--values values-image-updater.yaml

kubectl edit deployment argocd-image-updater -n argocd

     spec:
       containers:
       - args:
         - run
         - --interval
         - 10s
```

- 슬라이드 28
```
// docker hub에서 발급받은 token을 password로 입력함
// registry 주소가 registry.docker.io 에서 registry-1.docker.io 로 변경
kubectl create secret docker-registry dockerhub-cred -n argocd \
--docker-server=registry-1.docker.io \
--docker-username=도커허브사용자명  \
--docker-password=도커허브토큰

# kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- nodeapp-deploy.yaml
- nodeapp-svc.yaml

k8s-infra 리포지토리 git add 후 git commit 후 git push 할것
```

- 슬라이드 29
```
//argocd image updater 1.x부터 annotation으로 설정하는 것이 아니라 ImageUpdater CRD로 설정함
# image-updater.yaml 파일
# 대상 애플리케이션은 argocd에 생성한 애플리케이션의 이름을 지정함
apiVersion: argocd-image-updater.argoproj.io/v1alpha1
kind: ImageUpdater
metadata:
  name: myapp-image-updater
  namespace: argocd
spec:
  # ArgoCD Application이 있는 namespace
  namespace: argocd
  # Write-back 방식 설정
  writeBackConfig:
    method: "argocd"
  # 대상 Application 선택
  applicationRefs:
    - namePattern: "nodeapp-git-app"
      images:
        - alias: "nodeapp-git"
          imageName: "stephenwon/nodeapp-git"
          commonUpdateSettings:
            updateStrategy: "semver"
            forceUpdate: true
            pullSecret: "pullsecret:argocd/dockerhub-cred"

// 작성후 kubectl apply -f image-updater.yaml 실행
```

- 슬라이드 30~31
```
# argocd image updater 재시작
kubectl rollout restart deployment argocd-image-updater-controller -n argocd

# argocd image updater 로그 조회
kubectl logs -n argocd $(kubectl get pods -n argocd -o jsonpath="{.items[*].metadata.name}" | tr ' ' '\n' | grep argocd-image-updater-controller)


@슬라이드31
kubectl logs -n argocd $(kubectl get pods -n argocd -o jsonpath="{.items[*].metadata.name}" | tr ' ' '\n' | grep argocd-image-updater-controller) --since 2m
```

<a id="haproxy"></a>
# HAProxy Ingress Controller 적용하기
- Ingress Nginx Controller를 대신해 사용할 수 있는 Ingress Controller입니다.
- Ingress Nginx Controller는 지원이 종료되었습니다.(관련된 문서를 보려면 [여기](https://nginxstore.com/blog/kubernetes/ingress-nginx-%EC%A7%80%EC%9B%90-%EC%A2%85%EB%A3%8C-%EC%95%88%EB%82%B4-kubernetes-ingress-controller/)를 클릭하세요)

### helm을 이용해 haproxy-iongress-controller 설치
```
# 사전조건 : metalLB가 설치되어 있어야 함. 
# helm repo 추가 후 업데이트
helm repo add haproxytech https://haproxytech.github.io/helm-charts
helm repo update

# namespace 생성
kubectl create namespace haproxy-controller

# ingress-nginx 네임스페이스 ingress-controller 설치
# service 타입을 LB로 설정하고 LB의 IP 주소를 192.168.56.60으로 설정. 이를 위해 metalLB가 미리 설정되어야 함
helm upgrade -i -n haproxy-controller haproxy-ingress haproxytech/kubernetes-ingress \
  --set controller.service.type=LoadBalancer \
  --set controller.service.loadBalancerIP=192.168.56.60 \
  --set controller.ingressClass=haproxy \
  --set controller.ingressClassResource.name=haproxy \
  --set controller.ingressClassResource.enabled=true
```

### nodeapp1.yaml, nodeapp2.yaml은 ingress-nginx-controller에서 사용하던 것과 동일함

### Ingress 작성 (haproxy-ingress-pathrewrite.yaml)
성-
- 작성후 kubectl apply -f haproxy-ingress-pathrewrite.yaml  명령 실행
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path1-ingress
  annotations:
    haproxy.org/path-rewrite: "/path1/(.*) /\\1"
spec:
  ingressClassName: haproxy
  rules:
  - host: demo.192.168.56.60.nip.io
    http:
      paths:
      - pathType: ImplementationSpecific
        path: /path1/
        backend:
          service:
            name: svc-nodeapp1
            port:
              number: 8080
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: path2-ingress
  annotations:
    haproxy.org/path-rewrite: "/path2/(.*) /\\1"
spec:
  ingressClassName: haproxy
  rules:
  - host: demo.192.168.56.60.nip.io
    http:
      paths:
      - pathType: ImplementationSpecific
        path: /path2/
        backend:
          service:
            name: svc-nodeapp2
            port:
              number: 8080
```

### 기능 테스트
```
curl http://demo.192.168.56.60.nip.io/path1/abc
curl http://demo.192.168.56.60.nip.io/path2/abc
```

### 테스트 완료 후 리소스 정리
```
kubectl delete -f haproxy-ingress-pathrewrite.yaml

kubectl delete -f nodeapp1.yaml
kubectl delete -f nodeapp2.yaml

helm uninstall haproxy-ingress -n haproxy-controller
kubectl delete namespaces haproxy-controller
```

### Ingress에 경로 다시쓰기 기능을 적용하지 않는 경우
- haproxy-ingress.yaml
```
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: haproxy-ingress
spec:
  ingressClassName: haproxy
  rules:
  - host: demo.192.168.56.60.nip.io
    http:
      paths:
      - pathType: Prefix
        path: /path1
        backend:
          service:
            name: svc-nodeapp1
            port:
              number: 8080
      - pathType: Prefix
        path: /path2
        backend:
          service:
            name: svc-nodeapp2
            port:
              number: 8080
```
---

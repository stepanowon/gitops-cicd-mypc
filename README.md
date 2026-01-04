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
## HAProxy Ingress Controller 적용하기
- Ingress Nginx Controller를 대신해 사용할 수 있는 Ingress Controller입니다.
- Ingress Nginx Controller는 지원이 종료되었습니다.(관련된 문서를 보려면 [여기](https://nginxstore.com/blog/kubernetes/ingress-nginx-%EC%A7%80%EC%9B%90-%EC%A2%85%EB%A3%8C-%EC%95%88%EB%82%B4-kubernetes-ingress-controller/)를 클릭하세요)

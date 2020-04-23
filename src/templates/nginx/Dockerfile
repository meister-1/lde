FROM nginx:1.13

RUN apt-get -y update \
    && apt-get -y upgrade

COPY certs/* /etc/nginx/

COPY default.conf /etc/nginx/conf.d/
COPY nginx.conf /etc/nginx/

#ENV HOSTNAME="/bin/hostname -f"

ENV NGINX_RESOLVER "127.0.0.11"

CMD ["nginx", "-g", "daemon off;"]

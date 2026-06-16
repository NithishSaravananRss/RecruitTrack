FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

CMD ["java","-jar","target/recruittrack-backend-1.0.0-SNAPSHOT.jar"]
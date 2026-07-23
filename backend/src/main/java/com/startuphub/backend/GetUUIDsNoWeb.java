package com.startuphub.backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.WebApplicationType;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

//@SpringBootApplication
public class GetUUIDsNoWeb {
    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(GetUUIDsNoWeb.class);
        app.setWebApplicationType(WebApplicationType.NONE);
        app.run(args);
    }
    
    //@Bean
    public CommandLineRunner commandLineRunner(DataSource dataSource) {
        return args -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT email, uuid FROM users WHERE email IN ('karanthejkk@gmail.com', 'adithya70755@gmail.com')")) {
                while (rs.next()) {
                    System.out.println("USER_UUID_" + rs.getString("email") + "=" + rs.getString("uuid"));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            System.exit(0);
        };
    }
}

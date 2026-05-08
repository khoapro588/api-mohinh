using Microsoft.EntityFrameworkCore;
using ModelStore.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ModelStore API", Version = "v1", Description = "API quản lý cửa hàng mô hình ModelStore" });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Cho phép React (localhost:3000) gọi API này
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// Tự động tạo Database MySQL nếu chưa có
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.EnsureCreated();
    
    try {
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE Customers ADD COLUMN Role VARCHAR(50) DEFAULT 'customer';");
    } catch (System.Exception ex) { 
        System.Console.WriteLine("DB Note (Customers): " + ex.Message);
    } 

    try {
        dbContext.Database.ExecuteSqlRaw("ALTER TABLE FigureModels ADD COLUMN Series VARCHAR(255) NULL;");
    } catch (System.Exception ex) { 
        System.Console.WriteLine("DB Note (FigureModels): " + ex.Message);
    }
}

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "ModelStore API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowReact");
app.UseAuthorization();

app.MapControllers();

app.Run();

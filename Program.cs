using Microsoft.EntityFrameworkCore;
using ModelStore.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddOpenApi();

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
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("AllowReact");
app.UseAuthorization();

app.MapControllers();

app.Run();

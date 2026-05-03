using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelStore.Models;
using ModelStore.Data;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public OrdersController(ApplicationDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _db.Orders
                .Include(o => o.Items)
                .ToListAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _db.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();
            return Ok(order);
        }

        [HttpGet("customer/{customerId}")]
        public async Task<IActionResult> GetOrdersByCustomer(int customerId)
        {
            var orders = await _db.Orders
                .Include(o => o.Items)
                .Where(o => o.CustomerId == customerId)
                .ToListAsync();
            return Ok(orders);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] Order order)
        {
            order.OrderDate = DateTime.Now;
            order.Status = "Pending";
            _db.Orders.Add(order);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound();
            order.Status = status;
            await _db.SaveChangesAsync();
            return Ok(order);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound();
            _db.Orders.Remove(order);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}

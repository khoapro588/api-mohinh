using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ModelStore.Models;
using ModelStore.Data;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public ReviewsController(ApplicationDbContext db) => _db = db;

        [HttpGet("model/{modelId}")]
        public async Task<IActionResult> GetReviews(int modelId)
        {
            var exists = await _db.FigureModels.AnyAsync(m => m.Id == modelId);
            if (!exists) return NotFound("Model not found");

            var reviews = await _db.Reviews
                .Where(r => r.ModelId == modelId)
                .ToListAsync();
            return Ok(reviews);
        }

        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] Review review)
        {
            var exists = await _db.FigureModels.AnyAsync(m => m.Id == review.ModelId);
            if (!exists) return NotFound("Model not found");

            _db.Reviews.Add(review);
            await _db.SaveChangesAsync();
            return Created($"/api/reviews/{review.Id}", review);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _db.Reviews.FindAsync(id);
            if (review == null) return NotFound();
            _db.Reviews.Remove(review);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
